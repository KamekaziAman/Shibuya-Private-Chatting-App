from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("chat", "0002_message"),
    ]

    operations = [
        migrations.AddField(
            model_name="message",
            name="client_id",
            field=models.CharField(blank=True, db_index=True, max_length=64, null=True),
        ),
        migrations.AddConstraint(
            model_name="message",
            constraint=models.UniqueConstraint(
                fields=("conversation", "sender", "client_id"),
                name="unique_message_client_id_per_sender",
            ),
        ),
    ]
