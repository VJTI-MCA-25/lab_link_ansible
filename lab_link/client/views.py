from django.shortcuts import render


def index(request):
    return render(request, 'client/hosts.html')


def host(request, host_id):
    return render(request, 'client/host.html', {'host_id': host_id})


def shutdown(request):
    return render(request, 'client/shutdown.html')
