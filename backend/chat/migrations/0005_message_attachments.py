from django.db import migrations, models
import chat.models


class Migration(migrations.Migration):
    dependencies = [
        ("chat", "0004_userpresence"),
    ]

    operations = [
        migrations.AlterField(
            model_name="message",
            name="content",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="message",
            name="attachment",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to=chat.models.chat_attachment_upload_to,
            ),
        ),
        migrations.AddField(
            model_name="message",
            name="attachment_category",
            field=models.CharField(
                blank=True,
                choices=[
                    ("image", "Image"),
                    ("video", "Video"),
                    ("file", "File"),
                ],
                max_length=12,
            ),
        ),
        migrations.AddField(
            model_name="message",
            name="attachment_name",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="message",
            name="attachment_size",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="message",
            name="attachment_type",
            field=models.CharField(blank=True, max_length=120),
        ),
    ]
