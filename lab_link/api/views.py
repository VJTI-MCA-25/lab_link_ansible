import api.utils.helper as helper
import ansible_runner
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

DUMMY = True


@api_view(['GET'])
def ping_hosts(request):
    if DUMMY:
        dummy_data = helper.generate_dummy_data()
        return Response(dummy_data, status=200)

    r = ansible_runner.run(
        private_data_dir='/home/aashay/lab_link_ansible/ansible',
        playbook='ping.yml',
        rotate_artifacts=1,
        quiet=True
    )
    transformed_output = helper.transform_ping_output(r.stats)
    return Response(transformed_output, status=status.HTTP_200_OK)


@api_view(['GET'])
def inventory(request):
    try:
        inventory = helper.get_inventory()
        return Response(inventory, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def host_details(request, host_id):
    if DUMMY:
        dummy_data = helper.load_dummy_sys_info()
        return Response(dummy_data, status=status.HTTP_200_OK)

    r = ansible_runner.run(
        private_data_dir='/home/aashay/lab_link_ansible/ansible',
        playbook='sys_info.yml',
        limit=host_id,
        rotate_artifacts=1,
        quiet=True
    )
    if not r.stats:
        return Response("Host not found", status=status.HTTP_404_NOT_FOUND)

    if r.rc != 0:
        return Response("Host was unreachable", status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    transformed_data = helper.transform_sys_info(r.events)
    return Response(transformed_data, status=status.HTTP_200_OK)


@api_view(['GET'])
def peripherals(request):
    if DUMMY:
        dummy_data = helper.load_dummy_peripherals()
        return Response(dummy_data, status=status.HTTP_200_OK)

    r = ansible_runner.run(
        private_data_dir='/home/aashay/lab_link_ansible/ansible',
        playbook='peripherals.yml',
        rotate_artifacts=1,
        quiet=True
    )

    if r.rc != 0:
        return Response("Host not found", status=status.HTTP_408_REQUEST_TIMEOUT)

    transformed_data = helper.transform_peripherals_output(r.events)
    return Response(transformed_data, status=status.HTTP_200_OK)


@api_view(['GET'])
def shutdown(request, host_id='all'):
    if DUMMY:
        dummy_data = helper.load_dummy_shutdown()
        return Response(dummy_data, status=status.HTTP_200_OK)

    r = ansible_runner.run(
        private_data_dir='/home/aashay/lab_link_ansible/ansible',
        playbook='shutdown.yml',
        limit=host_id,
        rotate_artifacts=1,
        quiet=True,
    )

    if not r.stats:
        return Response("Host not found", status=status.HTTP_404_NOT_FOUND)

    transformed_data = helper.transform_shutdown_output(r.events)
    return Response(transformed_data, status=status.HTTP_200_OK)
