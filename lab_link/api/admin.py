from django.contrib import admin
from .models import App, SystemInfo, Host

# Register your models here.

admin.site.register(App)
admin.site.register(SystemInfo)
admin.site.register(Host)
