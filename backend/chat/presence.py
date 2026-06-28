from datetime import timedelta

from django.utils import timezone

PRESENCE_STALE_SECONDS = 90
HEARTBEAT_INTERVAL_SECONDS = 30


def is_presence_stale(presence, *, now=None):
    if not presence:
        return True

    current_time = now or timezone.now()
    stale_at = current_time - timedelta(seconds=PRESENCE_STALE_SECONDS)
    return presence.updated_at < stale_at


def is_user_online(presence, *, now=None):
    if not presence or not presence.is_online:
        return False
    return not is_presence_stale(presence, now=now)


def reconcile_stale_presence(presence, *, now=None):
    """Clear leaked online state when no heartbeat has been received recently."""
    if not presence or not presence.is_online:
        return False

    if not is_presence_stale(presence, now=now):
        return False

    current_time = now or timezone.now()
    presence.is_online = False
    presence.connection_count = 0
    if not presence.last_seen:
        presence.last_seen = presence.updated_at or current_time
    return True


def build_presence_payload(presence):
    online = is_user_online(presence)
    last_seen = presence.last_seen if presence else None
    return online, last_seen
