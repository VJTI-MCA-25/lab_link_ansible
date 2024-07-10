import api.utils.helper as helper
import ansible_runner
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import App
import logging
from django.core.cache import cache

logger = logging.getLogger(__name__)

DUMMY = True  # Toggle this for Dummy Data


def run_ansible_playbook(playbook, limit=None, extravars=None):
    return ansible_runner.run(
        private_data_dir='/home/aashay/lab_link_ansible/ansible',
        playbook=playbook,
        limit=limit,
        extravars=extravars,
        rotate_artifacts=1,
        quiet=True
    )


@api_view(['GET'])
def ping_hosts(request):
    if DUMMY:
        return Response(helper.generate_dummy_data(), status=status.HTTP_200_OK)

    uncache = request.query_params.get('uncached') == 'true'
    cache_key = 'ping_hosts'

    if not uncache:
        cached_data = cache.get(cache_key)
        if cached_data:
            response = Response(cached_data, status=status.HTTP_200_OK)
            response['X-Cache-Status'] = 'HIT'
            return response

    r = run_ansible_playbook('ping.yml')
    transformed_output = helper.transform_ping_output(r.stats)
    cache.set(cache_key, transformed_output, 60 * 15)
    response = Response(transformed_output, status=status.HTTP_200_OK)
    response['X-Cache-Status'] = 'MISS'
    return response


@api_view(['GET'])
def inventory(request):
    uncache = request.query_params.get('uncached') == 'true'
    cache_key = 'inventory'

    if not uncache:
        cached_data = cache.get(cache_key)
        if cached_data:
            response = Response(cached_data, status=status.HTTP_200_OK)
            response['X-Cache-Status'] = 'HIT'
            return response

    try:
        inventory = helper.get_inventory()
        cache.set(cache_key, inventory, 60 * 15)
        response = Response(inventory, status=status.HTTP_200_OK)
        response['X-Cache-Status'] = 'MISS'
        return response
    except Exception as e:
        return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def host_details(request, host_id):
    if DUMMY:
        return Response(helper.load_dummy_sys_info(), status=status.HTTP_200_OK)

    uncache = request.query_params.get('uncached') == 'true'
    cache_key = f'host_details_{host_id}'

    if not uncache:
        cached_data = cache.get(cache_key)
        if cached_data:
            response = Response(cached_data, status=status.HTTP_200_OK)
            response['X-Cache-Status'] = 'HIT'
            return response

    r = run_ansible_playbook('sys_info.yml', limit=host_id)
    if not r.stats:
        return Response("Host not found", status=status.HTTP_404_NOT_FOUND)

    if r.rc != 0:
        return Response("Host was unreachable", status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    transformed_data = helper.transform_sys_info(r.events)
    cache.set(cache_key, transformed_data, 60 * 15)
    response = Response(transformed_data, status=status.HTTP_200_OK)
    response['X-Cache-Status'] = 'MISS'
    return response


@api_view(['GET'])
def peripherals(request):
    if DUMMY:
        return Response(helper.load_dummy_peripherals(), status=status.HTTP_200_OK)

    uncache = request.query_params.get('uncached') == 'true'
    cache_key = 'peripherals'

    if not uncache:
        cached_data = cache.get(cache_key)
        if cached_data:
            response = Response(cached_data, status=status.HTTP_200_OK)
            response['X-Cache-Status'] = 'HIT'
            return response

    r = run_ansible_playbook('peripherals.yml')
    if r.rc != 0:
        return Response("Host not found", status=status.HTTP_408_REQUEST_TIMEOUT)

    transformed_data = helper.transform_peripherals_output(r.events)
    cache.set(cache_key, transformed_data, 60 * 15)
    response = Response(transformed_data, status=status.HTTP_200_OK)
    response['X-Cache-Status'] = 'MISS'
    return response


@api_view(['GET'])
def shutdown(request, host_id='all'):
    if DUMMY:
        return Response(helper.load_dummy_shutdown(), status=status.HTTP_200_OK)

    r = run_ansible_playbook('shutdown.yml', limit=host_id)
    if not r.stats:
        return Response("Host not found", status=status.HTTP_404_NOT_FOUND)

    transformed_data = helper.transform_shutdown_output(r.events)
    response = Response(transformed_data, status=status.HTTP_200_OK)
    response['X-Cache-Status'] = 'MISS'
    return response


@api_view(['GET'])
def wol(request, host_id):
    if DUMMY:
        return Response("Wake on LAN not supported in dummy mode", status=status.HTTP_501_NOT_IMPLEMENTED)

    try:
        inventory = helper.get_inventory()
    except Exception as e:
        return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if host_id not in inventory:
        return Response("Host not found", status=status.HTTP_404_NOT_FOUND)

    mac_address = inventory[host_id]['mac_address']
    broadcast_address = helper.ip_to_broadcast(inventory[host_id]['ip'])

    r = run_ansible_playbook('wol.yml', limit=host_id, extravars={
        'mac_address': mac_address, 'broadcast_address': broadcast_address
    })
    if not r.stats:
        return Response("Host not found", status=status.HTTP_404_NOT_FOUND)

    events = [event['event'] for event in r.events]
    response = Response(events, status=status.HTTP_200_OK)
    response['X-Cache-Status'] = 'MISS'
    return response


@api_view(['GET'])
def install_app(request, host_id):
    if DUMMY:
        return Response("Applications installed successfully", status=status.HTTP_200_OK)

    app_name = request.query_params.get('app_name')
    if not app_name:
        return Response("app_name query parameter is required", status=status.HTTP_400_BAD_REQUEST)

    r = run_ansible_playbook('install_app.yml', limit=host_id, extravars={
        'app_name': app_name
    })
    if not r.stats:
        return Response("Host not found", status=status.HTTP_404_NOT_FOUND)

    if 'failed' in r.stats and r.stats['failed'] > 0:
        return Response("Installation failed", status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    response = Response("Applications installed successfully",
                        status=status.HTTP_200_OK)
    response['X-Cache-Status'] = 'MISS'
    return response


@api_view(['GET'])
def uninstall_app(request, host_id):
    if DUMMY:
        return Response("Applications uninstalled successfully", status=status.HTTP_200_OK)

    app_name = request.query_params.get('app_name')
    if not app_name:
        return Response("app_name query parameter is required", status=status.HTTP_400_BAD_REQUEST)

    r = run_ansible_playbook('uninstall_app.yml', limit=host_id, extravars={
        'app_name': app_name
    })
    if not r.stats:
        return Response("Host not found", status=status.HTTP_404_NOT_FOUND)

    failures = r.stats.get('failures', {})
    if any(count > 0 for count in failures.values()):
        return Response("Uninstallation failed", status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    response = Response(
        "Applications uninstalled successfully", status=status.HTTP_200_OK)
    response['X-Cache-Status'] = 'MISS'
    return response


@api_view(['GET'])
def check_logs(request, host_id='all'):
    r = run_ansible_playbook('collect_logs.yml', limit=host_id)
    if not r.stats:
        return Response("Host not found", status=status.HTTP_404_NOT_FOUND)

    response = Response({}, status=status.HTTP_200_OK)
    response['X-Cache-Status'] = 'MISS'
    return response


@api_view(['GET'])
def get_host_applications(request, host_id):
    if DUMMY:
        return Response(helper.load_dummy_host_applications(), status=status.HTTP_200_OK)

    uncache = request.query_params.get('uncached') == 'true'
    cache_key = f'host_applications_{host_id}'

    if not uncache:
        cached_data = cache.get(cache_key)
        if cached_data:
            response = Response(cached_data, status=status.HTTP_200_OK)
            response['X-Cache-Status'] = 'HIT'
            return response

    r = run_ansible_playbook('host_applications.yml', limit=host_id)
    if not r.stats:
        return Response("Host not found", status=status.HTTP_404_NOT_FOUND)

    transformed_data = helper.transform_host_applications(r.events)
    cache.set(cache_key, transformed_data, 60 * 15)
    response = Response(transformed_data, status=status.HTTP_200_OK)
    response['X-Cache-Status'] = 'MISS'
    return response


@api_view(['GET'])
def get_applications_from_list(request):
    if DUMMY:
        return Response(helper.load_dummy_applications_from_list(), status=status.HTTP_200_OK)

    uncache = request.query_params.get('uncached') == 'true'
    cache_key = 'all_applications'

    if not uncache:
        cached_data = cache.get(cache_key)
        if cached_data:
            response = Response(cached_data, status=status.HTTP_200_OK)
            response['X-Cache-Status'] = 'HIT'
            return response

    apps = list(App.objects.values_list('command', 'package_name'))
    app_list = [{'command': command, 'package_name': package_name}
                for command, package_name in apps]

    r = run_ansible_playbook('applications_from_list.yml', extravars={
                             "app_list": app_list})

    if not r.stats:
        return Response("Host not found", status=status.HTTP_404_NOT_FOUND)

    transformed_data = helper.transform_applications_from_list(r.events)
    cache.set(cache_key, transformed_data, 60 * 15)
    response = Response(transformed_data, status=status.HTTP_200_OK)
    response['X-Cache-Status'] = 'MISS'
    return response
