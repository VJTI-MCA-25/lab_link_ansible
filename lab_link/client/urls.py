from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('host/<str:host_id>/', views.host, name='host'),
    path('shutdown/', views.shutdown, name='shutdown'),
]
