from rest_framework.decorators import api_view 
from rest_framework.response import Response
import api.utils.helper_functions as utils
import ansible_runner



@api_view(['GET'])
def ping_hosts(request):
    # r = ansible_runner.run(private_data_dir='/home/aashay/lab_link_ansible/ansible', playbook='ping.yml')
    # transformed_output = utils.transform_ping_output(r.stats)
    # return Response(transformed_output, status=200)
    dummy_data = utils.generate_dummy_data()
    return Response(dummy_data, status=200)

@api_view(['GET'])
def inventory(request):
    try:
        inventory = utils.get_inventory()
        return Response(inventory, status=200)
    except Exception as e:
        return Response(str(e), status=500)

@api_view(['GET'])
def host_details(request, host_id):
    try:
        host_details = { host_id: "This is test data" }
        return Response(host_details, status=200)
    except Exception as e:
        return Response(str(e), status=500)