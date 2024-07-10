from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from api.models import App
import json


@login_required
def index(request):
    return render(request, 'client/dashboard.djhtml')


@login_required
def host(request, host_id):
    context = {'host_id': host_id}
    return render(request, 'client/host_info.djhtml', context)


@login_required
def applications(request, host_id=None):
    if host_id:
        context = {
            'host_id': host_id,
        }
        return render(request, 'client/host_applications.djhtml', context)
    else:
        apps = App.objects.all()
        headers = [app.name for app in apps]
        package_names = [app.package_name for app in apps]
        keys_json = json.dumps(package_names)
        context = {
            'keys_json': keys_json,
            'headers': headers
        }
        return render(request, 'client/all_applications.djhtml', context)
