# Generated by Django 5.0.4 on 2024-07-04 15:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_rename_package_app_command_app_package_name_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='app',
            name='command',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
    ]
