from api.models import Host
from api.serializers import HostSerializer
import json


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
                        ["ansible_host"], "user": inventory[host]["ansible_user"]}
    return result


def get_inventory():
    hosts = Host.objects.all()
    serializer = HostSerializer(hosts, many=True)
    hosts = dict()
    for host_id, data in serializer.data:
        hosts[host_id] = data
    return hosts


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

    # data['cpus'] = data['cpus']

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
    with open('/tmp/logs_map.json', 'r') as f:
        logs_map = json.load(f)
    return logs_map
