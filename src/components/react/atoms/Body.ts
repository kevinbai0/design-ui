import styled from "styled-components";
import Body from "../../atoms/Body";
import { DNA } from "../../../theme/types";

export default styled.p<DNA>`
    ${props => Body(props, "react")}
`;