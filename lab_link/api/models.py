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
