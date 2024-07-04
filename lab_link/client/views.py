from django.shortcuts import render
from django.contrib.auth.decorators import login_required


@login_required
def index(request):
    return render(request, 'client/dashboard.html')


@login_required
def host(request, host_id):
    context = {'host_id': host_id}
    return render(request, 'client/host-info.html', context)


@login_required
def applications(request, host_id=None):
    context = {'host_id': host_id}
    return render(request, 'client/applications.html', context)
