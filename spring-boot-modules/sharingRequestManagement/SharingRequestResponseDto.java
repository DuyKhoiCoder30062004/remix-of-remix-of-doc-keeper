package com.saigontechnologyintern.document_management.sharingRequestManagement;

import java.time.LocalDateTime;

public class SharingRequestResponseDto {
    private Integer request_id;
    private Integer doc_id;
    private Integer requester_id;
    private String requester_name;
    private String requester_email;
    private String permission;
    private String status;
    private LocalDateTime requested_at;

    public SharingRequestResponseDto() {}

    public SharingRequestResponseDto(
            Integer request_id,
            Integer doc_id,
            Integer requester_id,
            String requester_name,
            String requester_email,
            String permission,
            String status,
            LocalDateTime requested_at) {
        this.request_id = request_id;
        this.doc_id = doc_id;
        this.requester_id = requester_id;
        this.requester_name = requester_name;
        this.requester_email = requester_email;
        this.permission = permission;
        this.status = status;
        this.requested_at = requested_at;
    }

    public Integer getRequest_id() {
        return request_id;
    }

    public void setRequest_id(Integer request_id) {
        this.request_id = request_id;
    }

    public Integer getDoc_id() {
        return doc_id;
    }

    public void setDoc_id(Integer doc_id) {
        this.doc_id = doc_id;
    }

    public Integer getRequester_id() {
        return requester_id;
    }

    public void setRequester_id(Integer requester_id) {
        this.requester_id = requester_id;
    }

    public String getRequester_name() {
        return requester_name;
    }

    public void setRequester_name(String requester_name) {
        this.requester_name = requester_name;
    }

    public String getRequester_email() {
        return requester_email;
    }

    public void setRequester_email(String requester_email) {
        this.requester_email = requester_email;
    }

    public String getPermission() {
        return permission;
    }

    public void setPermission(String permission) {
        this.permission = permission;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getRequested_at() {
        return requested_at;
    }

    public void setRequested_at(LocalDateTime requested_at) {
        this.requested_at = requested_at;
    }
}
