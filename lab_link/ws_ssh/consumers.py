import paramiko
from channels.generic.websocket import WebsocketConsumer


class SSHConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()

        hostname = self.scope['url_route']['kwargs']['hostname']
        port = self.scope['url_route']['kwargs'].get('port', '22')
        try:
            port = int(port)
        except ValueError:
            port = 22
        username = self.scope['url_route']['kwargs']['username']
        password = self.scope['url_route']['kwargs']['password']

        self.ssh = paramiko.SSHClient()
        self.ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        try:
            self.ssh.connect(
                hostname=hostname,
                port=port,
                username=username,
                password=password,
            )

            self.channel = self.ssh.invoke_shell()
        except Exception as e:
            self.close(code=4000)

    def disconnect(self, code):
        if hasattr(self, 'channel'):
            self.channel.close()

    def receive(self, text_data):
        try:
            self.channel.send(text_data)

            while self.channel.recv_ready():
                data = self.channel.recv(1024)
                self.send(text_data=data.decode())
        except Exception as e:
            self.close(code=4000)
