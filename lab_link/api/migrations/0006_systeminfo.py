# Generated by Django 5.0.7 on 2024-07-11 20:22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_alter_app_command'),
    ]

    operations = [
        migrations.CreateModel(
            name='SystemInfo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('system', models.CharField(max_length=100)),
                ('release', models.CharField(max_length=100)),
                ('type', models.CharField(max_length=100)),
                ('version', models.CharField(max_length=100)),
                ('hostname', models.CharField(max_length=100)),
                ('architecture', models.CharField(max_length=100)),
                ('memory', models.CharField(max_length=100)),
                ('disk_usage', models.CharField(max_length=100)),
                ('ip_address', models.CharField(max_length=100)),
                ('users', models.CharField(max_length=100)),
                ('uptime', models.CharField(max_length=100)),
                ('network_interfaces', models.JSONField()),
                ('mac_addresses', models.JSONField()),
                ('ipv4_addresses', models.JSONField()),
                ('ipv6_addresses', models.JSONField()),
                ('dns_servers', models.JSONField()),
                ('gateway', models.CharField(max_length=100)),
                ('domain', models.CharField(blank=True, max_length=100)),
                ('timezone', models.CharField(max_length=100)),
                ('locale', models.CharField(max_length=100)),
                ('python_version', models.CharField(max_length=100)),
                ('peripherals', models.JSONField()),
                ('cpus', models.JSONField()),
                ('cores', models.IntegerField()),
            ],
        ),
    ]