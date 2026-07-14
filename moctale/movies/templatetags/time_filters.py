from django import template
from django.utils.timezone import now

register = template.Library()

@register.filter
def smart_time(value):
    if not value:
        return "Just now"
        
    diff = now() - value
    seconds = diff.total_seconds()
    
    if seconds < 60:
        return "Just now"
    
    minutes = int(seconds // 60)
    if minutes < 60:
        return f"{minutes}m ago"
        
    hours = int(minutes // 60)
    if hours < 24:
        return f"{hours}h ago"
        
    days = int(hours // 24)
    if days < 7:
        return f"{days}d ago"
        
    weeks = int(days // 7)
    if weeks < 4:
        return f"{weeks}w ago"
        
    months = int(days // 30)
    if months < 12:
        return f"{months}mo ago"
        
    years = int(days // 365)
    return f"{years}y ago"