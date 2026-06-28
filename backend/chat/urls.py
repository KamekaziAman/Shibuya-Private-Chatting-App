from django.urls import path
from .views import (
    ConversationClearView,
    ConversationCreateView,
    ConversationListView,
    MessageListView,
)

urlpatterns = [
    path("conversations/", ConversationCreateView.as_view()),
    path("conversations/list/", ConversationListView.as_view()),
    path("conversations/<int:conversation_id>/clear/", ConversationClearView.as_view()),
    path("messages/<int:conversation_id>/", MessageListView.as_view()),
]
