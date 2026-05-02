from django.contrib import admin
from .models import Channel, ChannelMember, Message

admin.site.register(Channel)
admin.site.register(ChannelMember)
admin.site.register(Message)