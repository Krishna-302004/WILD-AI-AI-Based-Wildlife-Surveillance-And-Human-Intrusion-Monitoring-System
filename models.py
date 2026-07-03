from sqlalchemy import Boolean, Column, Integer, String, DateTime
from datetime import datetime
from database import Base

class DetectionHistory(Base):
    __tablename__ = "detection_history"
    id = Column(Integer, primary_key=True, index=True)
    species = Column(String, index=True)
    confidence = Column(String)
    danger_level = Column(String)
    image_path = Column(String)
    location = Column(String)
    timestamp = Column(DateTime, default=datetime.now)

class IntrusionAlert(Base):
    __tablename__ = "intrusion_alerts"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)
    location = Column(String)
    status = Column(String)
    timestamp = Column(DateTime, default=datetime.now)

class CommunityReport(Base):
    __tablename__ = "community_reports"
    id = Column(Integer, primary_key=True, index=True)
    location_lat = Column(String)
    location_lon = Column(String)
    location_text = Column(String)
    date = Column(String)
    time = Column(String)
    species = Column(String)
    notes = Column(String)
    contact = Column(String)
    is_authentic = Column(Boolean, default=False)
    image_path = Column(String)
    status = Column(String, default="pending")  # pending, verified, rejected
    timestamp = Column(DateTime, default=datetime.now)

class AdminLogin(Base):
    __tablename__ = "admin_logins"
    id = Column(Integer, primary_key=True, index=True)
    officer_id = Column(String, index=True)
    login_time = Column(DateTime, default=datetime.now)
    ip_address = Column(String)

class SystemSetting(Base):
    __tablename__ = "system_settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(String)
