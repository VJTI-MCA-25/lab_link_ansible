from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('', views.index, name='client_index'),
    path('host/<str:host_id>/', views.host, name='client_host'),
    path('applications/', views.applications, name='client_all_apps'),
    path('applications/<str:host_id>/',
         views.applications, name='client_host_apps'),
    path('login/', auth_views.LoginView.as_view(template_name='client/login.djhtml'),
         name='client_login'),
    path('logout/', auth_views.LogoutView.as_view(template_name='client/logout.djhtml'),
         name='client_logout'),
    path('password_reset/', auth_views.PasswordResetView.as_view(),
         name='client_password_reset'),
    path('password_reset/done/', auth_views.PasswordResetDoneView.as_view(),
         name='client_password_reset_done'),
    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(),
         name='client_password_reset_confirm'),
    path('reset/done/', auth_views.PasswordResetCompleteView.as_view(),
         name='client_password_reset_complete'),
]
