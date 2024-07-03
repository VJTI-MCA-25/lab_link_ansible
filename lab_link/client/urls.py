from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('host/<str:host_id>/', views.host, name='host'),
    path('applications/', views.applications, name='all_apps'),
    path('applications/<str:host_id>/', views.applications, name='host_apps'),
]
