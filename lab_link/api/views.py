from django.db import transaction
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
from datetime import datetime


def run_ansible_playbook(playbook, limit=None, extravars=None):
    r = ansible_runner.run(
        private_data_dir='/home/aashay/lab_link_ansible/ansible',
        playbook=playbook,
        limit=limit,  # Limit to a specific host
        extravars=extravars,
        rotate_artifacts=1,  # Keep only the latest artifact
        forks=10,  # Controls how many parallel processes are spawned
        # quiet=True # Suppresses output
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
    time_sync_cache_key = 'time_sync'
    last_sync = cache.get(time_sync_cache_key)
    current_time = datetime.now()

    if not last_sync or (current_time - last_sync).total_seconds() > 3 * 3600:
        time_sync_r = run_ansible_playbook('sync_time.yml')

        # Check if the playbook ran successfully
        if hasattr(time_sync_r, 'rc') and time_sync_r.rc == 0:
            cache.set(time_sync_cache_key, current_time, timeout=3 * 3600)

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
    try:
        # Check for ping cache and handle host failure
        if not request.uncache:
            # Retrieve data from cache if available
            cached_data = cache.get(cache_key)
            if cached_data:
                response = Response(cached_data, status=status.HTTP_200_OK)
                response['X-Data-Source'] = 'CACHE'
                return response

        # Check if host is unreachable
        is_unreachable = cache.get(f'unreachable_{host_id}')
        if is_unreachable and not request.uncache:
            raise HostUnreachable

        # Run Ansible playbook if no cache is found
        try:
            r = run_ansible_playbook('sys_info.yml', limit=host_id)
            raw_data = helper.extract_sys_info_events(r.events)
            transformed_data = helper.transform_sys_info(raw_data)
        except Exception as e:
            # Log or handle playbook execution errors
            raise HostUnreachable(f"Error running playbook: {str(e)}")

        # Cache the transformed data for future requests
        cache.set(cache_key, transformed_data, 60 * 15)

        # Use update_or_create to create or update system info
        with transaction.atomic():
            SystemInfo.objects.update_or_create(
                host_id=host_id,
                defaults=raw_data
            )

        return Response(transformed_data, status=status.HTTP_200_OK)

    except HostUnreachable as e:
        # Cache the unreachable status to avoid retrying too soon
        cache.set(f'unreachable_{host_id}', True, 60 * 60)

        # Handle unreachable host by retrieving data from the database
        system_info = SystemInfo.objects.filter(host_id=host_id).first()
        if system_info:
            serializer = SystemInfoSerializer(system_info)
            transformed_data = helper.transform_sys_info(serializer.data)
            response = Response(transformed_data, status=status.HTTP_200_OK)
            response['X-Data-Source'] = 'DATABASE'
            return response
        else:
            # Return a specific error response
            raise Exception('Host details not found')


@api_view(['GET'])
@error_handler
def shutdown(request, host_id='all'):
    r = run_ansible_playbook('shutdown.yml', limit=host_id)
    transformed_data = helper.transform_shutdown_output(r.events)
    return Response(transformed_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@error_handler
def install_app(request, host_id='all'):
    data = request.data
    app_list = data.get('app_list', [])
    if not app_list:
        raise Exception('No applications specified for installation')
    r = run_ansible_playbook('install_app.yml', limit=host_id, extravars={
        'app_list': app_list
    })
    transformed_data = helper.transform_uninstall_install(r.events)
    return Response(transformed_data, status=status.HTTP_200_OK)


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
    transformed_data = helper.transform_uninstall_install(r.events)
    return Response(transformed_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@error_handler
def check_logs(request, host_id='all'):
    r = run_ansible_playbook('collect_logs.yml', limit=host_id)
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
