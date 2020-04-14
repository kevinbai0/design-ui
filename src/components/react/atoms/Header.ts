import styled from "styled-components";
import Header from "../../atoms/Header";
import { DNA } from "../../../theme/types";

export default styled.h1<DNA>`
    ${props => Header(props, "react")}
`;