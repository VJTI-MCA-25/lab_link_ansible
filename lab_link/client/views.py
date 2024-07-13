from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from api.models import App
import json


@login_required
def index(request):
    context = {
        "breadcrumbs": [
            {
                "text": "Dashboard",
                "link": "/"
            }
        ]}
    # Ensure the template path is correct
    return render(request, 'client/dashboard.djhtml', context)


@login_required
def host(request, host_id):
    context = {
        'host_id': host_id,
        "breadcrumbs": [
            {
                "text": "Dashboard",
                "link": "/"
            },
            {
                "text": host_id,
                "link": f"/host/{host_id}"
            }
        ],
    }
    return render(request, 'client/host_info.djhtml', context)


@login_required
def applications(request, host_id=None):
    if host_id:
        context = {
            'host_id': host_id,
            "breadcrumbs": [
                {
                    "text": "Dashboard",
                    "link": "/"
                },
                {
                    "text": host_id,
                    "link": f"/host/{host_id}"
                },
                {
                    "text": "Applications",
                    "link": f"/applications/{host_id}"
                }
            ],
        }
        return render(request, 'client/host_applications.djhtml', context)
    else:
        apps = App.objects.all()
        headers = [app.name for app in apps]
        package_names = [app.package_name for app in apps]
        keys_json = json.dumps(package_names)
        context = {
            'keys_json': keys_json,
            'headers': headers,
            "breadcrumbs": [
                {
                    "text": "Dashboard",
                    "link": "/"
                },
                {
                    "text": "Applications",
                    "link": "/applications"
                }
            ]
        }
        return render(request, 'client/all_applications.djhtml', context)
