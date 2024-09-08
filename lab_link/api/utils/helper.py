from ansible_runner import get_inventory as get_inventory_from_ansible_runner


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
        result[host] = {"status": result[host], "ip": inventory[host]
                        ["ip"], "user": inventory[host]["user"]}
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
        ...                 "ansible_user": "admin",
        ...                 "mac_address": "00:11:22:33:44:55"
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
                "user": "admin",
                "mac": "00:11:22:33:44:55"
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
        host_info = {"ip": details["ansible_host"],
                     "user": details["ansible_user"]}
        if "mac_address" in details:
            host_info["mac_address"] = details["mac_address"]
            host_info["broadcast_address"] = details["broadcast_address"]
        output[host] = host_info
    return output


def get_inventory():
    """
    Retrieves the inventory from Ansible Runner.

    Returns:
        dict: The transformed output of the inventory.

    Raises:
        Exception: If there is an error retrieving the inventory.
    """
    out, err = get_inventory_from_ansible_runner(
        action='list',
        inventories=[
            '/home/aashay/lab_link_ansible/ansible/inventory/hosts.yml'],
        response_format='json',
        quiet=True
    )
    if err:
        raise Exception(err)
    else:
        transformed_output = transform_inventory_output(out)
        return transformed_output


def extract_sys_info_events(events):
    for event in events:
        if event['event'] == 'runner_on_ok' and event['event_data']['task'] == "Print collected information":
            data = event['event_data']['res']['platform_info']
            break
    return data


def transform_sys_info(data):
    """
    Transforms the system information data by formatting the Python version and CPUs.

    Args:
        data (dict): The system information data.

    Returns:
        dict: The transformed system information data.
    """
    cpus = data['cpus']
    cpus_str = ["{} {}".format(cpus[i+1], cpus[i+2])
                for i in range(0, len(cpus) - 1, 3)]
    data['cpus'] = cpus_str

    grouped_data = {
        'Storage And Memory': {
            'Memory': {
                'Total': data['mem_total'],
                'Used': data['mem_used'],
                'Free': data['mem_free'],
            },
            'Disk': {
                'Total': data['disk_total'],
                'Used': data['disk_used'],
                'Free': data['disk_free'],
            },
        },
        'System Details': {
            'System': data['system'],
            'Release': data['release'],
            'Architecture': data['architecture'],
            'Type': data['type'],
            'Version': data['version'],
            'Hostname': data['hostname'],
            'Uptime': data['uptime'],
            'Users': data['users'],
        },
        'Specifications': {
            'CPUs': data['cpus'],
            'Core Count': data['cores'],
        },
        'Network': {
            'Default IP': data['default_ip'],
            'Network Interfaces': data['network_interfaces'],
            'MAC Addresses': data['mac_addresses'],
            'IPv4 Addresses': data['ipv4_addresses'],
            'IPv6 Addresses': data['ipv6_addresses'],
            'DNS Servers': data['dns_servers'],
            'Gateway': data['gateway'],
            'Domain': data['domain'],
            'Timezone': data['timezone'],
        },
        'Other': {
            'Locale': data['locale'],
            'Python Version': data['python_version'],
        },
        'Peripheral Devices': data['peripheral_devices'],
    }

    return grouped_data


def transform_shutdown_output(events):
    """
    Transforms the given data into a dictionary with host, status, and time information.

    Args:
        data (list): A list of events.

    Returns:
        dict: A dictionary containing transformed data with host, status, and time information.
    """
    try:
        inventory = get_inventory()
    except Exception:
        inventory = None

    transformed_data = {}
    for event in events:
        event_data = event.get('event_data', {})

        if event.get('event') == 'runner_on_ok' and event_data.get('task') == "Shutdown host(s)":
            host = event_data.get('host')
            shutdown = event_data.get('res', {}).get('shutdown')
            time = event_data.get('end')

            data = {"shutdown": shutdown, "time": time}

            if inventory and host in inventory:
                data.update(
                    {"ip": inventory[host]["ip"], "user": inventory[host]["user"]})

            transformed_data[host] = data

    return transformed_data


def ip_to_subnet_mask(ip_address):
    """
    Convert an IP address to its corresponding subnet mask.

    Args:
        ip_address (str): The IP address in the format 'xxx.xxx.xxx.xxx'.

    Returns:
        str: The subnet mask corresponding to the given IP address.

    Example:
        >>> ip_to_subnet_mask('192.168.0.120')
        '255.255.255.0'
    """
    # Split the IP address into octets
    ip_octets = list(map(int, ip_address.split('.')))

    # Determine the network class based on the first octet
    first_octet = ip_octets[0]
    if first_octet <= 127:
        # Class A network
        return '255.0.0.0'
    elif first_octet <= 191:
        # Class B network
        return '255.255.0.0'
    elif first_octet <= 223:
        # Class C network
        return '255.255.255.0'
    else:
        # Not within the range of known classes
        return None


def ip_to_broadcast(ip_address):
    """
    Convert an IP address to its broadcast address.

    Args:
        ip_address (str): The IP address in the format 'xxx.xxx.xxx.xxx'.

    Returns:
        str: The broadcast address corresponding to the given IP address and subnet mask.

    Example:
        >>> ip_to_broadcast('192.168.0.120', '255.255.255.0')
        '192.168.0.255'
    """
    subnet_mask = ip_to_subnet_mask(ip_address)

    # Split the IP address and subnet mask into octets
    ip_octets = list(map(int, ip_address.split('.')))
    subnet_octets = list(map(int, subnet_mask.split('.')))

    # Calculate the broadcast address
    broadcast_octets = [(ip_octets[i] | ~subnet_octets[i])
                        & 255 for i in range(4)]

    return '.'.join(map(str, broadcast_octets))


def transform_host_applications(events):
    applications = {}
    for event in events:
        if event['event'] == 'runner_on_ok':
            if event['event_data']['task'] == "Print installed applications":
                applications[event['event_data']['host']
                             ] = event['event_data']['res']["packages"]["stdout_lines"]

    if not applications:
        return []

    host_id = next(iter(applications))

    packages = []
    for line in applications[host_id]:
        parts = line.split(" ", 2)
        if len(parts) == 3:
            name, version, size = parts
            packages.append(
                {'name': name, 'version': version, 'size': f"{size} Kb"})

    return packages


def transform_applications_from_list(events):
    applications = {}
    for event in events:
        if event['event'] == 'runner_on_unreachable':
            applications[event['event_data']['host']] = "unreachable"
        if event['event'] == 'runner_on_ok':
            host = event['event_data']['host']
            if event['event_data']['task'] == "Display app status and versions":
                app_status = event['event_data']['res']['app_status']
                if host not in applications:
                    applications[host] = {}
                for app, status in app_status.items():
                    version = status['version'] if status['version'] else 'N/A'
                    version_short = version.splitlines()[
                        0] if version else 'N/A'
                    applications[host][app] = {
                        'installed': status['installed'],
                        'version_long': version,
                        'version_short': version_short
                    }

    return applications


def transform_uninstall_install(events):
    packages = {}
    for event in events:
        if event['event'].startswith('runner_item_on_'):
            item = event.get('event_data', {}).get('res', {}).get('item')
            if item:
                status = event['event'].split('_')[-1]
                status = 'success' if status == 'ok' else status
                packages[item] = status
    return packages


def transform_logs(events):
    for event in events:
        if event['event'] == 'runner_on_ok' and event['event_data']['task'] == "Print all the logs":
            return event['event_data']['res']['msg']
