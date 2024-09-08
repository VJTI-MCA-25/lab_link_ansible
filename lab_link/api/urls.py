from django.urls import path
from . import views

urlpatterns = [
    path('ping', views.ping_hosts, name="api_ping"),
    path('inventory', views.inventory, name="api_inventory"),
    path('host/<str:host_id>', views.host_details, name="api_host_info"),

    path('shutdown', views.shutdown, name="api_all_shutdown"),
    path('shutdown/<str:host_id>', views.shutdown, name="api_host_shutdown"),

    path('install/', views.install_app, name="api_all_install_app"),
    path('install/<str:host_id>/', views.install_app,
         name="api_host_install_app"),

    path('uninstall/',
         views.uninstall_app, name="api_all_uninstall_app"),
    path('uninstall/<str:host_id>/', views.uninstall_app,
         name="api_host_uninstall_app"),

    path('logs/<str:host_id>', views.check_logs, name="api_host_logs"),

    path('applications/<str:host_id>', views.get_host_applications,
         name="api_host_applications"),
    path('applications/', views.get_applications_from_list,
         name="api_all_applications"),

    path('search-package/', views.search_package, name="api_search_package")
]
