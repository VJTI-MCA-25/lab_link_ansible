import api.utils.helper as helper
import ansible_runner
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import App
import logging
from django.core.cache import cache
import subprocess

logger = logging.getLogger(__name__)


def error_handler(func):
    def wrapper(*args, **kwargs):
        try:
            result = func(*args, **kwargs)
            return result
        except Exception as e:
            logger.error(f"Error in view {func.__name__}: {str(e)}")
            return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return wrapper


def generate_cache_key(prefix):
    def get_cache_key(*args, **kwargs):
        # Extract the host_id from kwargs
        host_id = kwargs.get('host_id')
        return f'{prefix}_{host_id}'
    return get_cache_key


def cache_response(get_cache_key):
    def decorator(func):
        def wrapper(*args, **kwargs):
            cache_key = get_cache_key(*args, **kwargs)
            cached_data = cache.get(cache_key)
            if cached_data:
                response = Response(cached_data, status=status.HTTP_200_OK)
                response['X-Cache-Status'] = 'HIT'
                return response

            # Call the original function to get the data
            data = func(*args, **kwargs)

            # Cache the data
            cache.set(cache_key, data, 60 * 15)

            # Return the data wrapped in a Response
            return Response(data, status=status.HTTP_200_OK)

        return wrapper
    return decorator


def run_ansible_playbook(playbook, limit=None, extravars=None):
    r = ansible_runner.run(
        private_data_dir='/home/aashay/lab_link_ansible/ansible',
        playbook=playbook,
        limit=limit,
        extravars=extravars,
        rotate_artifacts=1,
        quiet=True
    )

    if not r.stats and (limit is not None and limit != 'all'):
        raise Exception("Host not found")

    if r.rc != 0 and (limit is not None and limit != 'all'):
        raise Exception("Host was unreachable")

    return r


@api_view(['GET'])
@error_handler
@cache_response(lambda *args, **kwargs: 'ping_hosts')
def ping_hosts(request):
    r = run_ansible_playbook('ping.yml')
    transformed_output = helper.transform_ping_output(r.stats)
    return transformed_output


@api_view(['GET'])
@error_handler
@cache_response(lambda *args, **kwargs: 'inventory')
def inventory(request):
    inventory = helper.get_inventory()
    return inventory


host_cache_key = generate_cache_key('host_details')


@api_view(['GET'])
@error_handler
@cache_response(host_cache_key)
def host_details(request, host_id):
    r = run_ansible_playbook('sys_info.yml', limit=host_id)
    transformed_data = helper.transform_sys_info(r.events)
    return transformed_data


@api_view(['GET'])
@error_handler
@cache_response(lambda *args, **kwargs: 'peripherals')
def peripherals(request):
    r = run_ansible_playbook('peripherals.yml')
    transformed_data = helper.transform_peripherals_output(r.events)
    return transformed_data


@api_view(['GET'])
@error_handler
def shutdown(request, host_id='all'):
    r = run_ansible_playbook('shutdown.yml', limit=host_id)
    transformed_data = helper.transform_shutdown_output(r.events)
    return Response(transformed_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@error_handler
def wol(request, host_id):
    inventory = helper.get_inventory()
    mac_address = inventory[host_id]['mac_address']
    broadcast_address = helper.ip_to_broadcast(inventory[host_id]['ip'])
    r = run_ansible_playbook('wol.yml', limit=host_id, extravars={
        'mac_address': mac_address, 'broadcast_address': broadcast_address
    })
    events = [event['event'] for event in r.events]
    return Response(events, status=status.HTTP_200_OK)


@api_view(['GET'])
@error_handler
def install_app(request, host_id='all'):
    app_name = request.query_params.get('app_name')
    if not app_name:
        raise Exception("app_name query parameter is required")
    r = run_ansible_playbook('install_app.yml', limit=host_id, extravars={
        'app_name': app_name
    })
    failures = r.stats.get('failures', {})
    if any(count > 0 for count in failures.values()):
        raise Exception("Installation Failed")
    return Response("Applications installed successfully", status=status.HTTP_200_OK)


@api_view(['GET'])
@error_handler
def uninstall_app(request, host_id='all'):
    app_name = request.query_params.get('app_name')
    if not app_name:
        raise Exception("app_name query parameter is required")
    r = run_ansible_playbook('uninstall_app.yml', limit=host_id, extravars={
        'app_name': app_name
    })
    failures = r.stats.get('failures', {})
    if any(count > 0 for count in failures.values()):
        raise Exception("Uninstallation Failed")
    return Response("Applications uninstalled successfully", status=status.HTTP_200_OK)


@api_view(['GET'])
@error_handler
def check_logs(request, host_id='all'):
    run_ansible_playbook('collect_logs.yml', limit=host_id)
    return Response({}, status=status.HTTP_200_OK)


host_apps_cache_key = generate_cache_key('host_applications')


@api_view(['GET'])
@error_handler
@cache_response(host_apps_cache_key)
def get_host_applications(request, host_id):
    r = run_ansible_playbook('host_applications.yml', limit=host_id)
    transformed_data = helper.transform_host_applications(r.events)
    return transformed_data


@api_view(['GET'])
@error_handler
@cache_response(lambda *args, **kwargs: 'all_applications')
def get_applications_from_list(request):
    apps = list(App.objects.values_list('command', 'package_name'))
    app_list = [{'command': command, 'package_name': package_name}
                for command, package_name in apps]
    r = run_ansible_playbook('applications_from_list.yml', extravars={
                             "app_list": app_list})
    transformed_data = helper.transform_applications_from_list(r.events)
    return transformed_data


@api_view(['GET'])
@error_handler
def search_package(request):
    query = request.query_params.get("q")
    limit = request.query_params.get("limit")
    if limit:
        try:
            limit = int(limit)
        except ValueError:
            return Response({"error": "Invalid limit parameter"}, status=status.HTTP_400_BAD_REQUEST)
    result = subprocess.run(
        ["/home/aashay/lab_link_ansible/apt-search.sh", query], text=True, capture_output=True)
    if result.returncode != 0:
        raise Exception("Error executing apt-cache search")
    transformed_data = helper.transform_search_package(result.stdout, limit)
    return Response(transformed_data, status=status.HTTP_200_OK)
