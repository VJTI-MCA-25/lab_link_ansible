import paramiko
from channels.generic.websocket import WebsocketConsumer
from ansible_runner import get_inventory
import logging
from threading import Thread, Lock
import time
from queue import Queue, Empty
# from api.utils.helper import get_inventory

logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)


class SSHConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        self.lock = Lock()
        self.command_queue = Queue()

        host_id = self.scope['url_route']['kwargs'].get('host_id')
        if not host_id:
            self.send_error("Host ID not provided.", 4000)
            return

        try:
            host = self.get_host_details(host_id)
            if not host:
                raise Exception("Host not found in inventory")
            hostname = host.get("ansible_host")
            username = host.get("ansible_user")
            password = host.get("ansible_become_password")

            if not all([hostname, username, password]):
                raise Exception("Incomplete host information")

            self.ssh = self.create_ssh_client(hostname, username, password)
            self.channel = self.ssh.invoke_shell()

            self.start_threads()

        except (paramiko.AuthenticationException, paramiko.SSHException, Exception) as e:
            logger.error(f"Connection error: {e}")
            self.send_error(f"Error: {str(e)}", 4001)

    def disconnect(self, close_code):
        self.clean_up()

    def receive(self, text_data):
        self.command_queue.put(text_data)

    def handle_commands(self):
        while True:
            try:
                command = self.command_queue.get(timeout=1)
                if command is None:  # Exit signal received
                    break
                self.channel.send(command)
            except Empty:
                continue  # Queue is empty, continue waiting
            except Exception as e:
                logger.error(f"Error sending command: {e}")
                break

    def listen_to_output(self):
        while True:
            try:
                if self.channel.recv_ready():
                    data = self.channel.recv(1024)
                    with self.lock:
                        self.send(text_data=data.decode())
                else:
                    time.sleep(0.1)  # Wait before checking again
            except Exception as e:
                logger.error(f"Error receiving output: {e}")
                break

        self.close(code=4002)

    def get_host_details(self, host_id):
        out, err = get_inventory(
            action='list',
            inventories=[
                '/home/aashay/lab_link_ansible/ansible/inventory/hosts.json'],
            response_format='json',
            host=host_id,
            quiet=True,
        )
        if err:
            raise Exception(f"Inventory error: {err}")
        return out["_meta"]["hostvars"].get(host_id)

    def create_ssh_client(self, hostname, username, password):
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(hostname=hostname, port=22,
                    username=username, password=password)
        return ssh

    def start_threads(self):
        self.command_thread = Thread(target=self.handle_commands, daemon=True)
        self.command_thread.start()

        self.output_thread = Thread(target=self.listen_to_output, daemon=True)
        self.output_thread.start()

    def clean_up(self):
        try:
            self.command_queue.put(None)  # Signal command thread to exit

            if self.command_thread and self.command_thread.is_alive():
                self.command_thread.join(timeout=2)

            if self.output_thread and self.output_thread.is_alive():
                self.output_thread.join(timeout=2)

            if self.channel:
                self.channel.close()

            if self.ssh:
                self.ssh.close()

        except Exception as e:
            logger.error(f"Error during disconnect: {e}")
        finally:
            super().disconnect(1000)

    def send_error(self, message, code):
        self.send(text_data=f"Error: {message}")
        self.close(code=code)
