package jp.co.recruit.riscon.entity;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

import lombok.Data;

@Data
@Entity
@Table(name="session")
public class Session implements Serializable{
    @Id
    @Column(name="id")
    public String id;

    @Column(name="username")
    public String username;

    @Column(name="expired_at")
    public Integer expiredAt;
}