from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/ssh/(?P<hostname>\w+)/(?P<port>\d+)?/(?P<username>\w+)/(?P<password>\w+)/$',
            consumers.SSHConsumer.as_asgi()),
]
