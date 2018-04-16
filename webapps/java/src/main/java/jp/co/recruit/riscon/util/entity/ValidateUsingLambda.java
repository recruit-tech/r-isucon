package jp.co.recruit.riscon.util.entity;

import java.util.List;

import jp.co.recruit.riscon.entity.Organizations;

public class ValidateUsingLambda {
    public boolean check(List<Organizations> list,Integer key) {
        return list.stream().filter(org -> org.id.equals(key)).findFirst().isPresent();
    }
}
