# Generated by Django 5.0.7 on 2024-07-12 18:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_systeminfo'),
    ]

    operations = [
        migrations.AddField(
            model_name='systeminfo',
            name='host_id',
            field=models.CharField(default='host', max_length=100, unique=True),
            preserve_default=False,
        ),
    ]