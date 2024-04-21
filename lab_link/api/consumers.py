import paramiko
from channels.generic.websocket import WebsocketConsumer
from ansible_runner import get_inventory
from concurrent.futures import ThreadPoolExecutor
import logging
from threading import Lock
import time  # Import time module for sleep

# TODO Handle Exit command
# TODO Handle Concurrent SSH Operations
# TODO Create a Session Management System


# Setup logging
logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)


class SSHConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        self.lock = Lock()

        host_id = self.scope['url_route']['kwargs'].get('host_id')
        if not host_id:
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
                raise Exception(err)

            host = out["_meta"]["hostvars"][host_id]
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

            self.channel = self.ssh.invoke_shell()

            # Create a thread pool executor with a maximum of 5 threads
            self.executor = ThreadPoolExecutor(
                max_workers=4,
                thread_name_prefix="SSHOperation",
            )
        except Exception as e:
            self.close(code=4000)

    def disconnect(self, close_code):
        if hasattr(self, 'channel') and self.channel:
            self.channel.close()
        if hasattr(self, 'ssh') and self.ssh:
            self.ssh.close()

        # Shutdown the thread pool executor
        if hasattr(self, 'executor') and self.executor:
            self.executor.shutdown(wait=False)

    def receive(self, text_data):
        try:
            # Submit the SSH operation to the thread pool executor
            self.executor.submit(self.handle_ssh_operations, text_data)
        except Exception as e:
            logger.error(
                "Error submitting SSH operation to thread pool: %s", e)

    def handle_ssh_operations(self, text_data):
        try:
            self.channel.send(text_data)

            start_time = time.time()  # Get the start time

            while True:
                # Check if data is available to be received
                if self.channel.recv_ready():
                    data = self.channel.recv(1024)
                    with self.lock:
                        self.send(text_data=data.decode())
                    start_time = time.time()  # Reset the timer
                elif self.channel.exit_status_ready():
                    self.close(code=4000)
                    break

                # Check if the elapsed time exceeds 0.1 seconds
                if time.time() - start_time >= 0.1:
                    break  # Break the loop if 0.1 seconds have elapsed

                # Introduce a short sleep to reduce CPU usage
                time.sleep(0.01)
        except Exception as e:
            logger.error("Error handling SSH operations: %s", e)
            self.close(code=4000)
