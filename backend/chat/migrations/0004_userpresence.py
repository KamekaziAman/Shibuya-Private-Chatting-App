from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("chat", "0003_message_client_id"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserPresence",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("is_online", models.BooleanField(default=False)),
                ("connection_count", models.PositiveIntegerField(default=0)),
                ("last_seen", models.DateTimeField(blank=True, null=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="presence",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
