package com.saigontechnologyintern.document_management.permissionManagement;

public class PermissionResponseDto {
    private Integer perm_id;
    private Integer doc_id;
    private Integer user_id;
    private String user_name;
    private String user_email;
    private String access_type;

    public PermissionResponseDto() {}

    public PermissionResponseDto(
            Integer perm_id,
            Integer doc_id,
            Integer user_id,
            String user_name,
            String user_email,
            String access_type) {
        this.perm_id = perm_id;
        this.doc_id = doc_id;
        this.user_id = user_id;
        this.user_name = user_name;
        this.user_email = user_email;
        this.access_type = access_type;
    }

    public Integer getPerm_id() {
        return perm_id;
    }

    public void setPerm_id(Integer perm_id) {
        this.perm_id = perm_id;
    }

    public Integer getDoc_id() {
        return doc_id;
    }

    public void setDoc_id(Integer doc_id) {
        this.doc_id = doc_id;
    }

    public Integer getUser_id() {
        return user_id;
    }

    public void setUser_id(Integer user_id) {
        this.user_id = user_id;
    }

    public String getUser_name() {
        return user_name;
    }

    public void setUser_name(String user_name) {
        this.user_name = user_name;
    }

    public String getUser_email() {
        return user_email;
    }

    public void setUser_email(String user_email) {
        this.user_email = user_email;
    }

    public String getAccess_type() {
        return access_type;
    }

    public void setAccess_type(String access_type) {
        this.access_type = access_type;
    }
}
