from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/ssh/(?P<host_id>\w+)/$',
            consumers.SSHConsumer.as_asgi()),
]
