from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
import api.utils.helper_functions as utils
import ansible_runner


@api_view(['GET'])
def ping_hosts(request):
    # r = ansible_runner.run(
    #     private_data_dir='/home/aashay/lab_link_ansible/ansible', playbook='ping.yml')
    # transformed_output = utils.transform_ping_output(r.stats)
    # return Response(transformed_output, status=status.HTTP_200_OK)

    dummy_data = utils.generate_dummy_data()
    return Response(dummy_data, status=200)


@api_view(['GET'])
def inventory(request):
    try:
        inventory = utils.get_inventory()
        return Response(inventory, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def host_details(request, host_id):
    # r = ansible_runner.run(
    #     private_data_dir='/home/aashay/lab_link_ansible/ansible',
    #     playbook='sys_info.yml',
    #     limit=host_id,
    #     rotate_artifacts=1,
    #     quiet=True
    # )

    # if not r.stats:
    #     return Response("Host not found", status=status.HTTP_404_NOT_FOUND)
    # for event in r.events:
    #     if event['event'] == 'runner_on_ok':
    #         if event['event_data']['task'] == "Print collected information":
    #             data = event['event_data']['res']['platform_info']
    #             transformer_data = utils.transform_sys_info(data)
    #             return Response(transformer_data, status=status.HTTP_200_OK)
    # return Response("Host was unreachable", status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    dummy_data = utils.load_dummy_sys_info()
    return Response(dummy_data, status=status.HTTP_200_OK)


@api_view(['GET'])
def peripherals(request):
    # r = ansible_runner.run(
    #     private_data_dir='/home/aashay/lab_link_ansible/ansible',
    #     playbook='peripherals.yml',
    #     rotate_artifacts=1,
    # )

    # if not r.stats:
    #     return Response("Host not found", status=status.HTTP_404_NOT_FOUND)

    # peripherals_dict = {}
    # for event in r.events:
    #     if event['event'] == 'runner_on_ok':
    #         if event['event_data']['task'] == "Print peripheral information":
    #             peripherals_dict[event['event_data']['host']
    #                              ] = event['event_data']['res']["peripherals"]

    # return Response(peripherals_dict, status=status.HTTP_200_OK)

    dummy_data = utils.load_dummy_peripherals()
    return Response(dummy_data, status=status.HTTP_200_OK)
