from django.core.cache import cache
import api.utils.helper as helper
import ansible_runner
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import App, SystemInfo
from .serializers import SystemInfoSerializer
from .exceptions import *
from .decorators import cached_view, error_handler, generate_cache_key, cache_middleware


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
        raise HostNotFound

    if r.rc != 0 and (limit is not None and limit != 'all'):
        raise HostUnreachable

    return r


@api_view(['GET'])
@error_handler
@cached_view(lambda *args, **kwargs: 'ping_hosts')
def ping_hosts(request):
    r = run_ansible_playbook('ping.yml')
    transformed_output = helper.transform_ping_output(r.stats)
    return Response(transformed_output, status=status.HTTP_200_OK)


@api_view(['GET'])
@error_handler
@cached_view(lambda *args, **kwargs: 'inventory')
def inventory(request):
    inventory = helper.get_inventory()
    return Response(inventory, status=status.HTTP_200_OK)


@api_view(['GET'])
@error_handler
@cache_middleware
def host_details(request, host_id):
    cache_key = f"host_details_{host_id}"
    if not request.uncache:
        cached_data = cache.get(cache_key)
        if cached_data:
            response = Response(cached_data, status=status.HTTP_200_OK)
            response['X-Data-Source'] = 'CACHE'
            return response
    try:
        r = run_ansible_playbook('sys_info.yml', limit=host_id)
        transformed_data = helper.transform_sys_info(r.events)
        cache.set(cache_key, transformed_data, 60 * 15)
        system_info, created = SystemInfo.objects.update_or_create(
            host_id=host_id,
            defaults=transformed_data
        )
        return Response(transformed_data, status=status.HTTP_200_OK)
    # If host is unreachable, check db for saved data
    except HostUnreachable:
        system_info = SystemInfo.objects.filter(host_id=host_id).first()
        if system_info:
            serializer = SystemInfoSerializer(system_info)
            response = Response(serializer.data, status=status.HTTP_200_OK)
            response['X-Data-Source'] = 'DATABASE'
            return response
        else:
            raise Exception('Host is unreachable and no cached data found.')


@api_view(['GET'])
@error_handler
@cached_view(lambda *args, **kwargs: 'peripherals')
def peripherals(request):
    r = run_ansible_playbook('peripherals.yml')
    transformed_data = helper.transform_peripherals_output(r.events)
    return Response(transformed_data, status=status.HTTP_200_OK)


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


@api_view(['POST'])
@error_handler
def uninstall_app(request, host_id='all'):
    data = request.data
    app_list = data.get('app_list', [])
    if not app_list:
        raise Exception('No applications specified for uninstallation')
    r = run_ansible_playbook('uninstall_app.yml', limit=host_id, extravars={
        'app_list': app_list
    })
    transformed_data = helper.transform_uninstall(r.events)
    return Response(transformed_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@error_handler
def check_logs(request, host_id='all'):
    run_ansible_playbook('collect_logs.yml', limit=host_id)
    return Response({}, status=status.HTTP_200_OK)


@api_view(['GET'])
@error_handler
@cached_view(lambda *args, **kwargs: generate_cache_key('host_apps')(*args, **kwargs))
def get_host_applications(request, host_id):
    r = run_ansible_playbook('host_applications.yml', limit=host_id)
    transformed_data = helper.transform_host_applications(r.events)
    return Response(transformed_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@error_handler
@cached_view(lambda *args, **kwargs: 'all_applications')
def get_applications_from_list(request):
    apps = list(App.objects.values_list('command', 'package_name'))
    app_list = [{'command': command, 'package_name': package_name}
                for command, package_name in apps]
    r = run_ansible_playbook('applications_from_list.yml', extravars={
                             "app_list": app_list})
    transformed_data = helper.transform_applications_from_list(r.events)
    return Response(transformed_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@error_handler
def search_package(request):
    query = request.query_params.get("q", "").strip().lower()
    limit = request.query_params.get("limit")

    if limit:
        try:
            limit = int(limit)
        except ValueError:
            raise Exception("Invalid limit parameter")

    try:
        with open('/home/aashay/lab_link_ansible/package_list.txt', 'r') as file:
            packages = file.read().splitlines()
    except FileNotFoundError:
        raise Exception("Package list file not found")

    filtered_packages = [pkg for pkg in packages if query in pkg.lower()]
    if limit:
        filtered_packages = filtered_packages[:limit]
    return Response(filtered_packages, status=status.HTTP_200_OK)
