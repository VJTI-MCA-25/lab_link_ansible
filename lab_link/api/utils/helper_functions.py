from ansible_runner import get_inventory as get_inventory_from_ansible_runner
import random

def transform_ping_output(output):
    """
    Transforms the ping output dictionary into a new dictionary with additional information.

    Args:
        output (dict): The ping output dictionary.

    Returns:
        dict: The transformed dictionary with additional information.

    Example:
        >>> output = {
        ...     'processed': ['host1', 'host2'],
        ...     'ok': ['host1'],
        ... }
        >>> transform_ping_output(output)
        {
            'host1': {
                'status': 'success',
                'ip': '192.168.1.100',
                'user': 'admin'
            },
            'host2': {
                'status': 'failed',
                'ip': '192.168.1.101',
                'user': 'admin'
            }
        }
    """
    result = {}
    for host in output['processed']:
        if host in output['ok']:
            result[host] = 'success'
        else:
            result[host] = 'failed'
    inventory = get_inventory()
    for host in result:
        result[host] = {"status": result[host], "ip": inventory[host]["ip"], "user": inventory[host]["user"]}
    return result


def generate_dummy_data():
    """
    Generates dummy data for IP addresses with random statuses.

    Returns:
        dict: A dictionary where the keys are IP addresses and the values are random statuses.
    """
    result = {}
    for i in range(1, 25):
        result[f"host_{i}"] = {
            "status": random.choice(["success", "failed"]),
            "ip": f"192.168.1.{i}",
            "user": "mca"
        }
    return result

def transform_inventory_output(out):
    """
    Transforms the inventory output dictionary into a new dictionary format.

    Args:
        out (dict): The inventory output dictionary.

    Returns:
        dict: The transformed dictionary with host details.

    Example:
        >>> out = {
        ...     "_meta": {
        ...         "hostvars": {
        ...             "host1": {
        ...                 "ansible_host": "192.168.1.100",
        ...                 "ansible_user": "admin"
        ...             },
        ...             "host2": {
        ...                 "ansible_host": "192.168.1.101",
        ...                 "ansible_user": "root"
        ...             }
        ...         }
        ...     }
        ... }
        >>> transform_inventory_output(out)
        {
            "host1": {
                "ip": "192.168.1.100",
                "user": "admin"
            },
            "host2": {
                "ip": "192.168.1.101",
                "user": "root"
            }
        }
    """
    output = {}
    hosts = out["_meta"]["hostvars"]
    for host, details in hosts.items():
        output[host] = {"ip": details["ansible_host"], "user": details["ansible_user"]}

    return output

def get_inventory():
    out, err = get_inventory_from_ansible_runner(
        action='list',
        inventories=['/home/aashay/lab_link_ansible/ansible/inventory/hosts.yml'],
        response_format='json',
    )
    if err:
        raise Exception(err)
    else:
        transformed_output = transform_inventory_output(out)
        return transformed_output