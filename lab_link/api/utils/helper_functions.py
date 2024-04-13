def transform_ping_output(output):
    """
    Transforms the output of a ping operation into a dictionary with hosts as keys and their status as values.

    Args:
        output (dict): The output of the ping operation, containing processed, ok, and failed hosts.

    Returns:
        dict: A dictionary with hosts as keys and their status ('success' or 'failed') as values.
    """
    result = {}
    for host in output['processed']:
        if host in output['ok']:
            result[host] = 'success'
        else:
            result[host] = 'failed'
    return result