import paramiko
from channels.generic.websocket import WebsocketConsumer
from ansible_runner import get_inventory
import logging
from threading import Thread, Lock
import time
from queue import Queue, Empty

logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)


class SSHConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        self.lock = Lock()

        host_id = self.scope['url_route']['kwargs'].get('host_id')
        if not host_id:
            self.send(text_data="Error: Host ID not provided.")
            self.close(code=4000)
            return

        try:
            out, err = get_inventory(
                action='list',
                inventories=[
                    '/home/aashay/lab_link_ansible/ansible/inventory/hosts.yml'],
                response_format='json',
                host=host_id,
                quiet=True,
            )

            if err:
                raise Exception(f"Inventory error: {err}")

            host = out["_meta"]["hostvars"].get(host_id)
            if not host:
                raise Exception("Host not found in inventory")

            hostname = host.get("ansible_host")
            username = host.get("ansible_user")
            password = host.get('ansible_become_password')

            if not all([hostname, username, password]):
                raise Exception("Incomplete host information")

            self.ssh = paramiko.SSHClient()
            self.ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            self.ssh.connect(
                hostname=hostname,
                port=22,
                username=username,
                password=password,
            )

            self.command_queue = Queue()
            self.channel = self.ssh.invoke_shell()

            self.command_thread = Thread(target=self.handle_commands)
            self.command_thread.daemon = True
            self.command_thread.start()

            self.output_thread = Thread(target=self.listen_to_output)
            self.output_thread.daemon = True
            self.output_thread.start()

        except paramiko.AuthenticationException:
            logger.error(
                "Authentication failed, please verify your credentials.")
            self.send(text_data="Error: Authentication failed.")
            self.close(code=4001)

        except paramiko.SSHException as e:
            logger.error(f"SSH error: {e}")
            self.send(text_data=f"Error: SSH error: {str(e)}")
            self.close(code=4001)

        except Exception as e:
            logger.error(f"Connection error: {e}")
            self.send(text_data=f"Error: {str(e)}")
            self.close(code=4001)

    def disconnect(self, close_code):
        try:
            if hasattr(self, 'command_queue'):
                self.command_queue.put(None)  # Signal command thread to exit

            if hasattr(self, 'command_thread') and self.command_thread.is_alive():
                self.command_thread.join(timeout=2)

            if hasattr(self, 'output_thread') and self.output_thread.is_alive():
                self.output_thread.join(timeout=2)

            if hasattr(self, 'channel') and self.channel:
                self.channel.close()

            if hasattr(self, 'ssh') and self.ssh:
                self.ssh.close()

        except Exception as e:
            logger.error(f"Error during disconnect: {e}")
        finally:
            # Make sure to close the WebSocket connection
            super().disconnect(close_code)

    def receive(self, text_data):
        self.command_queue.put(text_data)

    def handle_commands(self):
        while True:
            try:
                command = self.command_queue.get(timeout=1)
                if command is None:  # Exit signal received
                    break
                self.channel.send(command + '\n')
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

        # Ensure the WebSocket is closed if the output listening loop exits
        self.close(code=4002)
