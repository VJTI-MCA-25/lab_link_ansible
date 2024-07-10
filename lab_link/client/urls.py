from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('host/<str:host_id>/', views.host, name='host'),
    path('applications/', views.applications, name='all_apps'),
    path('applications/<str:host_id>/', views.applications, name='host_apps'),
    path('login/', auth_views.LoginView.as_view(template_name='client/login.djhtml'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(template_name='client/logout.djhtml'), name='logout'),
    path('password_reset/', auth_views.PasswordResetView.as_view(),
         name='password_reset'),
    path('password_reset/done/', auth_views.PasswordResetDoneView.as_view(),
         name='password_reset_done'),
    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(),
         name='password_reset_confirm'),
    path('reset/done/', auth_views.PasswordResetCompleteView.as_view(),
         name='password_reset_complete'),
]
