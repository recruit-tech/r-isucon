package jp.co.recruit.riscon.entity;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Embeddable;
import javax.persistence.Embedded;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

import lombok.Data;

@Data
@Entity
@Table(name="belongs_organizations")
public class BelongsOrganizations implements Serializable{
    @Id
    @Embedded
    public OrganizationsIdName organizationsIdName;

    @Embeddable
    @Data
    public static class OrganizationsIdName implements Serializable{
        @Column(name="organization_id")
        public Integer organizationId;
        @Column(name="username")
        public String username;
    }
}