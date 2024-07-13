from rest_framework import serializers
from .models import App, SystemInfo


class AppSerializer(serializers.ModelSerializer):
    class Meta:
        model = App
        fields = '__all__'


class SystemInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemInfo
        exclude = ['host_id']
