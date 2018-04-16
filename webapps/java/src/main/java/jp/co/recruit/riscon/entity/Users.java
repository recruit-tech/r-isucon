package jp.co.recruit.riscon.entity;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

import lombok.Data;

@Data
@Entity
@Table(name="users")
public class Users implements Serializable{
    @Id
    @Column(name="username")
    public String username;

    @Column(name="salt")
    public String salt;

    @Column(name="hash")
    public String hash;

    @Column(name="last_name")
    public String lastName;

    @Column(name="first_name")
    public String firstName;

    @Column(name="icon")
    public String icon;

    @Override
    public Users clone() {
        Users users = new Users();
        users.username = this.username;
        users.salt = this.salt;
        users.hash = this.hash;
        users.lastName = this.lastName;
        users.firstName = this.firstName;
        users.icon = this.icon;
        return users;
    }
}