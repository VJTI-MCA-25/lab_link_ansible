from django.shortcuts import render


def index(request):
    return render(request, 'client/dashboard.html')


def host(request, host_id):
    context = {'host_id': host_id}
    return render(request, 'client/host-info.html', context)


def applications(request, host_id=None):
    context = {'host_id': host_id}
    return render(request, 'client/applications.html', context)
