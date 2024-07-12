from django.db import models

# Create your models here.


class App(models.Model):
    name = models.CharField(max_length=200)
    package_name = models.CharField(max_length=200)
    command = models.CharField(max_length=200, blank=True, null=True)
    version = models.CharField(
        max_length=50, blank=True, null=True, default="N/A")
    description = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        valid_commands = [f"{self.package_name} -V", f"{self.package_name} -v"]
        if not self.command or self.command not in valid_commands:
            self.command = f"{self.package_name} --version"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class SystemInfo(models.Model):
    host_id = models.CharField(max_length=100, unique=True)
    system = models.CharField(max_length=100)
    release = models.CharField(max_length=100)
    type = models.CharField(max_length=100)
    version = models.CharField(max_length=100)
    hostname = models.CharField(max_length=100)
    architecture = models.CharField(max_length=100)
    memory = models.CharField(max_length=100)
    disk_usage = models.CharField(max_length=100)
    ip_address = models.CharField(max_length=100)
    users = models.CharField(max_length=100)
    uptime = models.CharField(max_length=100)
    network_interfaces = models.JSONField()
    mac_addresses = models.JSONField()
    ipv4_addresses = models.JSONField()
    ipv6_addresses = models.JSONField()
    dns_servers = models.JSONField()
    gateway = models.CharField(max_length=100)
    domain = models.CharField(max_length=100, blank=True)
    timezone = models.CharField(max_length=100)
    locale = models.CharField(max_length=100)
    python_version = models.CharField(max_length=100)
    peripherals = models.JSONField()
    cpus = models.JSONField()
    cores = models.IntegerField()

    def __str__(self):
        return f"{self.host_id} ({self.ip_address})"
