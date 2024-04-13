from rest_framework.decorators import api_view 
from rest_framework.response import Response
from api.utils.helper_functions import transform_ping_output
import ansible_runner
import random

@api_view(['GET'])
def ping_hosts(request):
    # r = ansible_runner.run(private_data_dir='/home/aashay/lab_link_ansible/ansible', playbook='ping.yml')
    # transformed_output = transform_ping_output(r.stats)
    # return Response(transformed_output, status=200)
    dummy_data = generate_dummy_data()
    return Response(dummy_data, status=200)


def generate_dummy_data():
    ip_addresses = [f"192.168.1.{i}" for i in range(1, 25)]
    statuses = ["success", "failed"]
    return {ip: random.choice(statuses) for ip in ip_addresses}