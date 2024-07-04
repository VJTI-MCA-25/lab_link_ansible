from django.urls import path
from . import views

urlpatterns = [
    path('ping', views.ping_hosts),
    path('inventory', views.inventory),
    path('host/<str:host_id>', views.host_details),
    path('peripherals', views.peripherals),
    path('shutdown', views.shutdown),
    path('shutdown/<str:host_id>', views.shutdown),
    path('wol/<str:host_id>', views.wol),
    path('install/<str:host_id>/', views.install_app),
    path('uninstall/<str:host_id>/', views.uninstall_app),
    path('logs', views.check_logs),
    path('logs/<str:host_id>', views.check_logs),
    path('applications/<str:host_id>', views.get_host_applications),
    path('applications/', views.get_applications_from_list)
]
