from rest_framework import serializers
from .models import App, SystemInfo, Host


class HostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Host
        fields = '__all__'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        host_dict = {key: value for key, value in data.items(
        ) if value is not None and key != 'host_id' and key != 'id'}
        return (instance.host_id, host_dict)


class AppSerializer(serializers.ModelSerializer):
    class Meta:
        model = App
        fields = ['name', 'version', 'description', 'url']


class SystemInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemInfo
        fields = '__all__'
