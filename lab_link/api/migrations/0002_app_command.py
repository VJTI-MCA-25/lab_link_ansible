# Generated by Django 5.0.4 on 2024-07-04 06:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='app',
            name='command',
            field=models.CharField(default='name', max_length=200),
            preserve_default=False,
        ),
    ]