from rest_framework import serializers
from .models import App, SystemInfo


class AppSerializer(serializers.ModelSerializer):
    class Meta:
        model = App
        fields = ['name', 'version', 'description', 'url']


class SystemInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemInfo
        fields = '__all__'
